#!/bin/sh

_jq() {
    echo ${1} | base64 --decode --ignore-garbage | jq -c ${2}
}

for d in ../tests/*/ ; do
    for f in $d* ; do # $d contains the ending /
        echo "$f"
        json=$(jq -cr '.[] | @base64' < $f)
        scenarioIndex=0
        for j in $json
        do
            scenario=$(_jq $j '.description')
            schemaUri="$f#/$scenarioIndex/schema"
            cases=$(echo $j | base64 --decode --ignore-garbage | jq -c '.tests[] | @base64')
            caseIndex=0
            for c in $cases
            do
                case=$(_jq $c '.description')
                instanceUri="$f#/$scenarioIndex/tests/$caseIndex/data"
                valid=$(_jq $c '.valid')

                ${1} --schema $schemaUri --instance $instanceUri
                if [[ $? -ne 0 ]]
                then
                    echo "'$scenario' / '$case' : $?"
                fi
#               capture result
                ((caseIndex++))
            done
            ((scenarioIndex++))
        done
    done
done
